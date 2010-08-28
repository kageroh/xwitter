<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:regexp="http://exslt.org/regular-expressions"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:twitter="http://api.twitter.com/"
  exclude-result-prefixes="regexp atom twitter">

  <xsl:output method="xml"
	encoding="utf-8"
	omit-xml-declaration="no"
	indent="yes"
	media-type="application/xml" />

  <xsl:template match="atom:feed">
	<statuses>
	  <xsl:apply-templates select="atom:entry" />
	</statuses>
  </xsl:template>

  <xsl:template match="atom:entry">
	<status>
	  <id><xsl:value-of select="regexp:replace(atom:id, '^tag:search.twitter.com,2005:(\d+)$', '', '$1')" /></id>
	  <created_at><xsl:value-of select="regexp:replace(atom:published, '^(\d+)-(\d+)-(\d+)T([:\d]+)Z$', '', 'N/A $2 $3 $4 +0000 $1')" /></created_at>
	  <source><xsl:value-of select="twitter:source" /></source>
	  <text><xsl:value-of select="atom:title" /></text>
	  <user>
		<profile_image_url><xsl:value-of select="atom:link[@rel='image']/@href" /></profile_image_url>
		<screen_name><xsl:value-of select="regexp:replace(atom:author/atom:uri, '^http://twitter.com/(.+)$', 'i', '$1')" /></screen_name>
	  </user>
	</status>
  </xsl:template>

</xsl:stylesheet>
