<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  exclude-result-prefixes="">

  <xsl:output method="xml"
	encoding="utf-8"
	omit-xml-declaration="no"
	indent="yes"
	media-type="text/xml" />

  <xsl:strip-space elements="*" />

  <xsl:variable name="upper">ABCDEFGHIJKLMNOPQRSTUVWXYZ</xsl:variable>
  <xsl:variable name="lower">abcdefghijklmnopqrstuvwxyz</xsl:variable>

  <xsl:template match="*">
	<xsl:element name="{translate(local-name(), $upper, $lower)}">
	  <xsl:copy-of select="@*" />
	  <xsl:apply-templates />
	</xsl:element>
  </xsl:template>

  <xsl:template match="statuses">
	<xsl:apply-templates />
  </xsl:template>

  <xsl:template match="user">
	<xsl:element name="{translate(local-name(), $upper, $lower)}">
	  <xsl:copy-of select="@*" />
	  <xsl:apply-templates select="followers_count/preceding-sibling::*" />
	</xsl:element>
  </xsl:template>

</xsl:stylesheet>
